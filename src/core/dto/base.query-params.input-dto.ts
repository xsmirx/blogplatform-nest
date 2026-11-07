import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { toPositiveIntOrDefault } from './helpers/to-positive-int-or-default.js';
import { toEnumOrDefault } from './helpers/to-enum-or-default.js';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export class BaseQueryParams {
  @Transform(toPositiveIntOrDefault(1))
  @IsInt()
  @Min(1)
  pageNumber: number = 1;

  @Transform(toPositiveIntOrDefault(10, 20))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @Transform(toEnumOrDefault(SortDirection, SortDirection.Desc))
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
