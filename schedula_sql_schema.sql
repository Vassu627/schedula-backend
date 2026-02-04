
CREATE TYPE sex_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE appointment_status AS ENUM (
    'Scheduled', 
    'Confirmed', 
    'Cancelled', 
    'Rescheduled', 
    'Completed', 
    'UnableToMeet'
);
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Refunded');
CREATE TYPE ticket_status AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');
CREATE TYPE ticket_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');


-- Table: USER

CREATE TABLE "user" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Table: DOCTOR

CREATE TABLE doctor (
    doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    years_of_experience INT NOT NULL CHECK (years_of_experience >= 0),
    qualifications VARCHAR(500),
    photo_url VARCHAR(500),
    availability_schedule TEXT,
    consultation_fee DECIMAL(10, 2) CHECK (consultation_fee >= 0),
    clinic_address TEXT,
    phone_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Table: COMPLAINT

CREATE TABLE complaint (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaint_name ON complaint(name);


-- Table: PATIENT

CREATE TABLE patient (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age < 150),
    sex sex_enum NOT NULL,
    weight DECIMAL(5, 2) CHECK (weight > 0),
    complaint_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) 
        REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaint(complaint_id) ON DELETE SET NULL
);



-- Table: CONSULTING_TYPE

CREATE TABLE consulting_type (
    consulting_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default consulting types
INSERT INTO consulting_type (type_name, description) VALUES 
    ('Regular', 'In-person consultation at clinic'),
    ('Online', 'Virtual consultation via chat or video');

-- Table: APPOINTMENT

CREATE TABLE appointment (
    appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_datetime TIMESTAMP NOT NULL,
    consulting_type_id UUID NOT NULL,
    token_number VARCHAR(50),
    status appointment_status DEFAULT 'Scheduled',
    payment_status payment_status DEFAULT 'Pending',
    patient_notes TEXT,
    added_to_calendar BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) 
        REFERENCES patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) 
        REFERENCES doctor(doctor_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_consulting_type FOREIGN KEY (consulting_type_id) 
        REFERENCES consulting_type(consulting_type_id) ON DELETE RESTRICT,
    
    -- Check: appointment must be in future (can be modified based on requirements)
    CONSTRAINT chk_appointment_future CHECK (appointment_datetime >= created_at)
);



-- Table: FEEDBACK

CREATE TABLE feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL,
    consulting_feedback_rating INT CHECK (consulting_feedback_rating BETWEEN 1 AND 5),
    hospital_clinic_feedback_rating INT CHECK (hospital_clinic_feedback_rating BETWEEN 1 AND 5),
    waiting_time_feedback_rating INT CHECK (waiting_time_feedback_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    google_review_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_feedback_appointment FOREIGN KEY (appointment_id) 
        REFERENCES appointment(appointment_id) ON DELETE CASCADE
);



-- Table: SUPPORT_TICKET

CREATE TABLE support_ticket (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'Open',
    priority ticket_priority DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) 
        REFERENCES "user"(user_id) ON DELETE CASCADE
);



-- Table: FRIEND_OR_FAMILY

CREATE TABLE friend_or_family (
    friend_family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    gender gender_enum,
    age INT CHECK (age > 0 AND age < 150),
    relationship VARCHAR(50),
    mobile_number VARCHAR(15),
    invite_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    CONSTRAINT fk_friend_family_user FOREIGN KEY (user_id) 
        REFERENCES "user"(user_id) ON DELETE CASCADE
);







-- Insert sample complaints
INSERT INTO complaint (name, description) VALUES 
    ('Fever', 'Elevated body temperature'),
    ('Headache', 'Pain in the head or neck region'),
    ('Stomach Pain', 'Abdominal discomfort or pain'),
    ('Cough', 'Persistent coughing'),
    ('Cold', 'Common cold symptoms'),
    ('Back Pain', 'Pain in the back region'),
    ('Skin Rash', 'Skin irritation or rash'),
    ('Pregnancy Check-up', 'Routine pregnancy examination'),
    ('Child Vaccination', 'Pediatric vaccination'),
    ('Regular Check-up', 'General health check-up');





