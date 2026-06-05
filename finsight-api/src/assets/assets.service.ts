import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CurrenciesService } from '../currencies/currencies.service';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async create(createAssetDto: CreateAssetDto, userId: string) {
    let currencyId = createAssetDto.currency_id;

    // Auto-link currency if not provided by trying to match name or category
    if (!currencyId) {
      currencyId = await this.resolveCurrencyId(
        createAssetDto.name,
        createAssetDto.category,
      );
    }

    const asset = this.assetRepository.create({
      ...createAssetDto,
      user_id: userId,
      currency_id: currencyId,
      date: createAssetDto.date || new Date().toISOString().split('T')[0],
    });
    return this.assetRepository.save(asset);
  }

  private async resolveCurrencyId(
    name: string,
    category: string,
  ): Promise<string | undefined> {
    const byName = await this.currenciesService
      .findByCode(name)
      .catch(() => null);
    if (byName) return byName.id;

    const commonCode = this.getCommonCodeForCategory(category);
    if (!commonCode) return undefined;

    const byCategory = await this.currenciesService
      .findByCode(commonCode)
      .catch(() => null);
    return byCategory?.id;
  }

  private getCommonCodeForCategory(category: string): string | null {
    switch (category) {
      case 'GOLD':
        return 'GOLD';
      case 'CRYPTO':
        return 'BTC'; // Default to BTC for crypto if unknown
      case 'FIAT':
        return 'USD';
      default:
        return null;
    }
  }

  async findAll(userId: string) {
    return this.assetRepository.find({
      where: { user_id: userId },
      relations: { currency: true },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const asset = await this.assetRepository.findOne({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    if (asset.user_id !== userId) {
      throw new ForbiddenException('You do not own this asset');
    }

    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
    const asset = await this.findOne(id, userId);
    Object.assign(asset, updateAssetDto);
    return this.assetRepository.save(asset);
  }

  async remove(id: string, userId: string) {
    const asset = await this.findOne(id, userId);
    return this.assetRepository.remove(asset);
  }
}
