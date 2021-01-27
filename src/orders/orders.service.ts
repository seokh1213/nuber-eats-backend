import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import {
  PUB_SUB,
  NEW_PENDING_ORDER,
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
} from './../common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { DishResolver } from './../restaurants/restaurants.resolver';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersOutput, GetOrdersInput } from './dtos/get-orders.dto';
import { Dish } from './../restaurants/entities/dish.entity';
import { OrderItem } from './entities/order-item.entity';
import { Restaurant } from './../restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateOrderOutput, CreateOrderInput } from './dtos/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant is not found.' };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          //abort this whole thing
          return { ok: false, error: 'Dish is not found.' };
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;

        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options: item.options }),
        );
        orderItems.push(orderItem);
      }

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      await this.pubsub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });

      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not create an order.' };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[] = null;
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: { customer: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: { driver: user, ...(status && { status }) },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: { owner: user },
          relations: ['orders'],
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat();
        orders = orders.filter((order) => !status || order.status === status);
      }
      return { ok: true, orders };
    } catch (error) {
      return { ok: false, error: 'Could not get orders' };
    }
  }

  canSee(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id)
      canSee = false;
    if (user.role === UserRole.Delivery && order.driverId !== user.id)
      canSee = false;
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id)
      canSee = false;
    return canSee;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return { ok: false, error: 'Order is not found' };
      }

      if (!this.canSee(user, order)) {
        return { ok: false, error: 'This order is not yours.' };
      }

      return { ok: true, order };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Could not get orders' };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return { ok: false, error: 'Order is not found.' };
      }

      if (!this.canSee(user, order)) {
        return { ok: false, error: 'This order is not yours.' };
      }

      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      } else if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      } else if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return { ok: false, error: "You can't change status." };
      }
      await this.orders.save({ id: order.id, status });
      const newOrder = { ...order, status };

      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubsub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }

      await this.pubsub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not update an order' };
    }
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: 'This order already has a driver',
        };
      }
      await this.orders.save({ id: orderId, driver });
      await this.pubsub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Can't take order" };
    }
  }
}
