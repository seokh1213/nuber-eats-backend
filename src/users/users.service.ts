import { MailService } from './../mail/mail.service';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { Verification } from './entities/verification.entity';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { JwtService } from './../jwt/jwt.service';
import { LoginInput } from './dtos/login.dto';
import { CreateAccountInput } from './dtos/create-account.dto';
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    role,
    password,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // check new user
    // create user & hash the passowrd

    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        //make error
        return { ok: false, error: 'There is a user with that email already' };
      }
      const user = await this.users.save(
        this.users.create({ email, role, password }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({ user }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      //make error
      return { ok: false, error: "Couldn't create account" };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return { ok: false, error: 'User not found' };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: 'Wrong password' };
      }
      const token = this.jwtService.sign(user.id);
      return { ok: true, token };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (e) {
      return { error: 'User Not Found', ok: false };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        if (await this.users.findOne({ email })) {
          return {
            ok: false,
            error: 'Could not update profile because there is same email.',
          };
        }
        user.email = email;
        user.verified = false;
        this.verifications.delete({ user: { id: user.id } });
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }

      if (password) {
        user.password = password;
      }

      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not update profile.' };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );

      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        this.verifications.delete(verification.id);
        return { ok: true };
      }

      return { ok: false, error: 'Verification not found.' };
    } catch (error) {
      return { error: 'Could not verify email.', ok: false };
    }
  }
}
