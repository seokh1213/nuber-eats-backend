import { Restaurant } from './../restaurants/entities/restaurant.entity';
import { Payment } from './entities/payment.enity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payments.service';
import { Module } from '@nestjs/common';
import { PaymentResolver } from './payments.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Restaurant])],
  providers: [PaymentResolver, PaymentService],
})
export class PaymentsModule {}
