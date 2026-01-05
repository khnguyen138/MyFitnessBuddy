import { Type } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export enum MealType {
  breakfast = "breakfast",
  lunch = "lunch",
  dinner = "dinner",
  snack = "snack",
}

export class CreateMealEntryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "local_date must be YYYY-MM-DD",
  })
  local_date!: string;

  @IsEnum(MealType)
  meal!: MealType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label_snapshot!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.000_001)
  serving_quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  serving_unit?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kcal!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  protein_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  carbs_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fat_g?: number;

  @IsOptional()
  @IsUUID()
  food_id?: string;
}

export class UpdateMealEntryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "local_date must be YYYY-MM-DD",
  })
  local_date?: string;

  @IsOptional()
  @IsEnum(MealType)
  meal?: MealType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  label_snapshot?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000_001)
  serving_quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  serving_unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kcal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  protein_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  carbs_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fat_g?: number;

  @IsOptional()
  @IsUUID()
  food_id?: string;
}

export class MealsByDateQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date must be YYYY-MM-DD",
  })
  date!: string;
}
