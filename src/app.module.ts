import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HelloModule } from './hello/hello.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DoctorProfilesModule } from './doctor-profiles/doctor-profiles.module';
import { SpecializationsModule } from './specializations/specializations.module';
import { AvailabilityModule } from './availability/availability.module';
import { SlotsModule } from './slots/slots.module';
import { NotificationModule } from './notifications/notification.module';
import { EngagementModule } from './engagement/engagement.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.DATABASE_URL?.includes('render')
        ? { rejectUnauthorized: false }
        : false,
    }),
    HelloModule,
    UsersModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    DoctorProfilesModule,
    SpecializationsModule,
    AvailabilityModule,
    SlotsModule,
    NotificationModule,
    EngagementModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [HealthController],
})
export class AppModule {}
