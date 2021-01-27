import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  SearchRestaurantOutput,
  SearchRestaurantInput,
} from './dtos/search-restaurant.dto';
import { RestaurantOutput, RestaurantInput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import {
  DeleteRestaurantOutput,
  DeleteRestaurantInput,
} from './dtos/delete-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Category } from './entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Raw, Repository } from 'typeorm';
import { CategoryOutput, CategoryInput } from './dtos/category.dto';
import { Interval, Cron } from '@nestjs/schedule';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );

      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        id: editRestaurantInput.restaurantId,
      });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not update restaurant.' };
    }
  }
  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        id: restaurantId,
      });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };
      }
      await this.restaurants.delete({ id: restaurantId });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete restaurant' };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: 'Could not load categories' };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return { ok: false, error: 'Could not found a category' };
      }
      const restaurants = await this.restaurants.find({
        where: { category },
        order: {
          isPromoted: 'DESC',
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      category.restaurants = restaurants;
      const totalResults = await this.countRestaurants(category);
      return { ok: true, category, totalPages: totalResults / 25 };
    } catch (error) {
      return { ok: false, error: 'Could not load category' };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 25,
        take: 25,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurants' };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu', 'category'],
      });
      if (!restaurant) {
        return { ok: false, error: 'Could not find restaurant' };
      }
      return { ok: true, restaurant };
    } catch {
      return { ok: false, error: 'Could not find restaurant' };
    }
  }

  async searchRestaurantsByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * 25,
        take: 25,
      });
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return { ok: false, error: 'Could not load restaurants' };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      if (!restaurant) {
        return { ok: false, error: 'Restaurant is not found.' };
      }
      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'This is not yours.' };
      }
      const dish = await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return { ok: true };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Could not create a dish.' };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return { ok: false, error: 'Dish is not found.' };
      }
      if (owner.id !== dish.restaurant.ownerId) {
        return { ok: false, error: 'Dish is not yours.' };
      }

      await this.dishes.save({ id: editDishInput.dishId, ...editDishInput });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'COuld not edit dish' };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return { ok: false, error: 'Dish is not found.' };
      }
      if (owner.id !== dish.restaurant.ownerId) {
        return { ok: false, error: 'The dish is not yours.' };
      }
      await this.dishes.delete(dishId);
      return { ok: true };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Could not delete.' };
    }
  }

  @Cron('0 0 0 * * *')
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      isPromoted: true,
      promotedUntil: LessThan(new Date()),
    });
    console.log(restaurants);

    restaurants.forEach((restaurant: Restaurant) => {
      try {
        restaurant.isPromoted = false;
        restaurant.promotedUntil = null;
        this.restaurants.save(restaurant);
      } catch {}
    });
  }
}
