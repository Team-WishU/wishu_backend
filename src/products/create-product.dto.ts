import { IsString, IsNumber, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  brand: string;

  @IsNumber()
  price: number;

  @IsString()
  category: string;

  @IsString()
  productUrl: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
