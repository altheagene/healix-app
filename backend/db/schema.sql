-- Healix clinic database structure. No data. Generated from db/clinic.db.
-- Create a fresh database with: sqlite3 db/clinic.db < db/schema.sql

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL,
    sex VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    department VARCHAR(100),
    level INT,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL
);

CREATE TABLE Conditions (
    condition_id INT PRIMARY KEY NOT NULL,
    condition_name VARCHAR(100) NOT NULL
);

CREATE TABLE patient_allergies (
    patient_id INT NOT NULL,
    allergy_id INT NOT NULL,
    PRIMARY KEY (patient_id, allergy_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (allergy_id) REFERENCES allergies(allergy_id)
);

CREATE TABLE patient_conditions (
    patient_id INT NOT NULL,
    condition_id INT NOT NULL,
    PRIMARY KEY (patient_id, condition_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (condition_id) REFERENCES conditions(condition_id)
);

CREATE TABLE supplies_categories (
    category_id INTEGER  PRIMARY KEY  AUTOINCREMENT,
    category_name VARCHAR(100) NOT NULL
);

CREATE TABLE supplies (
    supply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_name VARCHAR(150) NOT NULL,
    brand VARCHAR(100),
    category_id INTEGER,
    description VARCHAR(200), auto_deduct boolean, is_active boolean,
    FOREIGN KEY (category_id) REFERENCES supplies_categories(category_id)
);

CREATE TABLE Services (
 service_id INTEGER PRIMARY KEY AUTOINCREMENT,
service_name VARCHAR(100) NOT NULL 
);

CREATE TABLE visit_logs
 (visit_id INTEGER  PRIMARY KEY AUTOINCREMENT,
appointment_id INTEGER,
 patient_id INTEGER NOT NULL, 
service_id  INTEGER  NOT NULL,
staff_id INT NOT NULL, 
visit_datetime DATETIME NOT NULL,
Weight TEXT,
Temperature TEXT,
notes TEXT, 
FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
 FOREIGN KEY (service_id) REFERENCES Services(service_id) );

CREATE TABLE medication_details( 
medication_detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
visit_id INT NOT NULL, 
supply_id INT NOT NULL,
quantity  INTEGER,
FOREIGN KEY (visit_id) REFERENCES visit_logs(visit_id),
 FOREIGN KEY (supply_id) REFERENCES supplies(supply_id) );

CREATE TABLE appointments (
appointment_id INTEGER PRIMARY KEY AUTOINCREMENT, 
 appointment_date TEXT,

patient_id INTEGER NOT NULL, 
service_id INT NOT NULL,
start_time TEXT,
status VARCHAR(50) NOT NULL,
Notes TEXT,
 FOREIGN KEY (service_id) REFERENCES services(service_id) );

CREATE TABLE staff_categories (
    staff_category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(50) NOT NULL
);

CREATE TABLE staff (
staff_id INTEGER PRIMARY KEY AUTOINCREMENT, 
first_name VARCHAR(50) NOT NULL,
last_name VARCHAR(50) NOT NULL,
staff_category_id INT NOT NULL,
sex varchar(10),
phone VARCHAR(20), 
email VARCHAR(100),
username varchar(50) UNIQUE,
password varchar(50), middle_name varchar(50), birthday varchar(50),
FOREIGN KEY (staff_category_id) REFERENCES staff_categories (staff_category_id) );

CREATE TABLE allergies(
allergy_id INTEGER PRIMARY KEY AUTOINCREMENT,
allergy_name VARCHAR(100) NOT NULL);

CREATE TABLE patients (
    patient_id INTEGER PRIMARY KEY autoincrement,
    is_student BOOLEAN NOT NULL,
    student_id VARCHAR(20) UNIQUE,
    department varchar(50),
    level integer,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birthday DATE NOT NULL,
    sex VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    notes VARCHAR(1000),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20));

CREATE TABLE batches (
    batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_id INTEGER NOT NULL,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    expiration_date DATE,
    stock_level INTEGER,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id)
);

CREATE TABLE inventory (
    inv_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inv_date DATE NOT NULL,
    batch_id TEXT NOT NULL,
    item_in INTEGER NOT NULL,
    item_out INTEGER NOT NULL,
    FOREIGN KEY (batch_id) references batches(batch_id)
);

CREATE TABLE audit_logs (
                audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                staff_id INTEGER,
                username TEXT,
                role_name TEXT,
                action TEXT NOT NULL,
                resource TEXT,
                method TEXT,
                path TEXT,
                status_code INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                details TEXT,
                success INTEGER NOT NULL
            );

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_audit_logs_staff_id ON audit_logs(staff_id);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
