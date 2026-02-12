"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/user.entity");
const doctor_entity_1 = require("../doctors/doctor.entity");
const patient_entity_1 = require("../patients/patient.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let AuthService = class AuthService {
    usersService;
    jwtService;
    doctorRepo;
    patientRepo;
    constructor(usersService, jwtService, doctorRepo, patientRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.doctorRepo = doctorRepo;
        this.patientRepo = patientRepo;
    }
    async handleGoogleLogin(googleUser) {
        const { googleId, email, name } = googleUser;
        if (!email) {
            throw new Error('Google account has no email');
        }
        let user = await this.usersService.findByGoogleId(googleId);
        if (!user) {
            user = await this.usersService.create({
                googleId,
                email,
                name,
            });
        }
        const payload = { sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
            user,
        };
    }
    async selectRole(userId, role) {
        const user = await this.usersService.updateRole(userId, role);
        if (role === user_entity_1.Role.DOCTOR) {
            const doctor = this.doctorRepo.create({
                user,
                isVerified: false,
            });
            await this.doctorRepo.save(doctor);
        }
        if (role === user_entity_1.Role.PATIENT) {
            const patient = this.patientRepo.create({
                user,
            });
            await this.patientRepo.save(patient);
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __param(3, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map