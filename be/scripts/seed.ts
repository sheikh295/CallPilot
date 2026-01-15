import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/features/auth/auth.service';
import { UserRole } from '../src/entities/user.entity';
import { LoggerService } from '../src/services/logger/logger.service';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const logger = app.get(LoggerService);

  try {
    // Check if super-admin already exists
    const existingSuperAdmin = await authService.findUserByEmail('superadmin@callpilot.com');

    if (existingSuperAdmin) {
      console.log('✅ Super-admin user already exists');
      await logger.info('Seed script attempted to create super-admin but user already exists', {
        email: 'superadmin@callpilot.com',
      });
    } else {
      // Create super-admin user
      const superAdmin = await authService.createUser(
        'superadmin@callpilot.com',
        'SuperAdmin@123!',
        'Super Administrator',
        UserRole.SUPER_ADMIN
      );

      console.log('✅ Super-admin user created successfully');
      console.log(`📧 Email: superadmin@callpilot.com`);
      console.log(`🔑 Password: SuperAdmin@123!`);
      console.log(`👤 Role: ${superAdmin.role}`);

      await logger.info('Super-admin user created via seed script', {
        userId: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role,
      });
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    await logger.error('Seed script failed', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});