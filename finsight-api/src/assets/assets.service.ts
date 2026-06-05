import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CurrenciesService } from '../currencies/currencies.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class AssetsService {
  private static readonly QUANTITY_EPSILON = 1e-9;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async create(createAssetDto: CreateAssetDto, userId: string) {
    let currencyId = createAssetDto.currency_id;
    let purchaseCurrencyId = createAssetDto.purchase_currency_id;

    // Auto-link currency if not provided by trying to match name or category
    if (!currencyId) {
      currencyId = await this.resolveCurrencyId(
        createAssetDto.name,
        createAssetDto.category,
      );
    }

    if (!purchaseCurrencyId) {
      purchaseCurrencyId = await this.resolvePurchaseCurrencyId(userId);
    }

    const date = createAssetDto.date || new Date().toISOString().split('T')[0];

    await this.assertValidAssetPosition(userId, {
      ...createAssetDto,
      currency_id: currencyId,
      date,
    });

    const asset = this.assetRepository.create({
      ...createAssetDto,
      user_id: userId,
      currency_id: currencyId,
      purchase_currency_id: purchaseCurrencyId,
      date,
    });
    return this.assetRepository.save(asset);
  }

  private async resolvePurchaseCurrencyId(
    userId: string,
  ): Promise<string | undefined> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const defaultCode = user?.defaultCurrency || 'USD';
    const currency = await this.currenciesService
      .findByCode(defaultCode)
      .catch(() => null);
    return currency?.id;
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
      relations: { currency: true, purchase_currency: true },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: { currency: true, purchase_currency: true },
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

    const nextAsset = {
      ...asset,
      ...updateAssetDto,
      date: updateAssetDto.date || asset.date,
    };

    await this.assertValidAssetPosition(userId, nextAsset, id);

    Object.assign(asset, updateAssetDto);
    return this.assetRepository.save(asset);
  }

  async remove(id: string, userId: string) {
    const asset = await this.findOne(id, userId);
    return this.assetRepository.remove(asset);
  }

  private async assertValidAssetPosition(
    userId: string,
    candidate: {
      id?: string;
      name: string;
      currency_id?: string;
      quantity: number;
      date: string | Date;
    },
    excludeAssetId?: string,
  ) {
    const assets = await this.assetRepository.find({
      where: { user_id: userId },
      relations: { currency: true },
      order: { date: 'ASC', created_at: 'ASC' },
    });

    const groupedAssets = new Map<
      string,
      Array<{
        id?: string;
        name: string;
        currency_id?: string;
        quantity: number;
        date: string | Date;
      }>
    >();

    for (const asset of assets) {
      if (asset.id === excludeAssetId) continue;
      const key = await this.getAssetPositionKey(asset);
      if (!groupedAssets.has(key)) groupedAssets.set(key, []);
      groupedAssets.get(key)!.push(asset);
    }

    const candidateKey = await this.getAssetPositionKey(candidate);
    if (!groupedAssets.has(candidateKey)) groupedAssets.set(candidateKey, []);
    groupedAssets.get(candidateKey)!.push(candidate);

    const currentQuantity = groupedAssets
      .get(candidateKey)!
      .reduce((total, entry) => total + Number(entry.quantity), 0);

    if (currentQuantity < -AssetsService.QUANTITY_EPSILON) {
      throw new BadRequestException(
        `Sale quantity exceeds current holdings for ${candidate.name}`,
      );
    }
  }

  private async getAssetPositionKey(asset: {
    name: string;
    currency_id?: string;
    currency?: { code: string; id: string; name: string };
  }): Promise<string> {
    if (asset.currency?.code) {
      return `code:${asset.currency.code.trim().toUpperCase()}`;
    }

    const normalizedName = asset.name.trim().toUpperCase();
    const currency = await this.currenciesService
      .findByCode(normalizedName)
      .catch(() => null);
    if (currency?.code) {
      return `code:${currency.code.trim().toUpperCase()}`;
    }

    const matchingCurrencyByName = (await this.currenciesService.findAll()).find(
      (availableCurrency) =>
        availableCurrency.name.trim().toUpperCase() === normalizedName,
    );
    if (matchingCurrencyByName) {
      return `code:${matchingCurrencyByName.code.trim().toUpperCase()}`;
    }

    return asset.currency_id
      ? `currency:${asset.currency_id}`
      : `name:${normalizedName}`;
  }
}
