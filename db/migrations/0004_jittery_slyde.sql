ALTER TYPE "public"."discount_type" ADD VALUE 'set_price';--> statement-breakpoint
CREATE TABLE "referral_code_product_prices" (
	"referral_code_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_code_product_prices_referral_code_id_product_id_pk" PRIMARY KEY("referral_code_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "referral_code_product_prices" ADD CONSTRAINT "referral_code_product_prices_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_code_product_prices" ADD CONSTRAINT "referral_code_product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;