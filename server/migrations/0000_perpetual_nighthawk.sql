CREATE TABLE "batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"csv_file_name" text,
	"total_documents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"course_code" varchar NOT NULL,
	"last_sequence" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" text NOT NULL,
	"recipient_name" text NOT NULL,
	"dob" timestamp,
	"course" text NOT NULL,
	"course_code" varchar NOT NULL,
	"department" text,
	"college" text,
	"content" text,
	"duration" text,
	"batch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
CREATE TABLE "completion_letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"intern_id" varchar(255) NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"project_title" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"letter_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "global_certificate_sequence" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "global_certificate_sequence_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_name" text NOT NULL,
	"course_name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"completion_date" text,
	"letter_type" varchar NOT NULL,
	"batch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
