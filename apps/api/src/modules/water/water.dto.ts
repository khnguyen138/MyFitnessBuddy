import { Type } from "class-transformer";
import { IsInt, IsString, Matches, Min } from "class-validator";

export class CreateWaterEntryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "local_date must be YYYY-MM-DD" })
  local_date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount_ml!: number;
}

export class WaterByDateQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string;
}
