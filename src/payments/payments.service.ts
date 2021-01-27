import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Restaurant } from './../restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { Payment } from './entities/payment.enity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: 'Restaurant is not found.' };
      }
      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'This restaurant is not yours.' };
      }

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;

      await this.payments.save(
        this.payments.create({ transactionId, user: owner, restaurant }),
      );
      await this.restaurants.save(restaurant);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not create a payment.' };
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: owner });
      return { ok: true, payments };
    } catch {
      return { ok: false, error: 'Could not get payments.' };
    }
  }
}
