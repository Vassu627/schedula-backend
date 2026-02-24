"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const hello_module_1 = require("./hello/hello.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const doctors_module_1 = require("./doctors/doctors.module");
const patients_module_1 = require("./patients/patients.module");
const appointments_module_1 = require("./appointments/appointments.module");
const doctor_profiles_module_1 = require("./doctor-profiles/doctor-profiles.module");
const specializations_module_1 = require("./specializations/specializations.module");
const availability_module_1 = require("./availability/availability.module");
const slots_module_1 = require("./slots/slots.module");
const notification_module_1 = require("./notifications/notification.module");
const engagement_module_1 = require("./engagement/engagement.module");
const schedule_1 = require("@nestjs/schedule");
const health_controller_1 = require("./health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL,
                autoLoadEntities: true,
                synchronize: true,
                ssl: process.env.DATABASE_URL?.includes('render')
                    ? { rejectUnauthorized: false }
                    : false,
            }),
            hello_module_1.HelloModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            doctors_module_1.DoctorsModule,
            patients_module_1.PatientsModule,
            appointments_module_1.AppointmentsModule,
            doctor_profiles_module_1.DoctorProfilesModule,
            specializations_module_1.SpecializationsModule,
            availability_module_1.AvailabilityModule,
            slots_module_1.SlotsModule,
            notification_module_1.NotificationModule,
            engagement_module_1.EngagementModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map