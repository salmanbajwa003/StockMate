import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DatabaseSeedService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      // Check if admin user already exists
      const existingAdmin = await this.usersRepository.findOne({
        where: [{ username: 'admin' }, { email: 'admin@gmail.com' }],
      });

      if (existingAdmin) {
        this.logger.log('Admin user already exists. Skipping seed.');
        return;
      }

      // Create admin user
      const adminUser = this.usersRepository.create({
        name: 'admin',
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'admin',
      });

      await this.usersRepository.save(adminUser);
      this.logger.log('✅ Admin user created successfully!');
      this.logger.log('   Username: admin');
      this.logger.log('   Email: admin@gmail.com');
      this.logger.log('   Password: admin');
    } catch (error) {
      this.logger.error('❌ Failed to seed admin user:', error.message);
      // Don't throw error to prevent app crash, just log it
    }
  }
}
