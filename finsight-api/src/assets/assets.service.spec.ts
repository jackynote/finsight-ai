import { BadRequestException } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetCategory } from '../common/enums/asset-category.enum';

describe('AssetsService', () => {
  const usdCurrency = {
    id: 'usd-currency-id',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    type: AssetCategory.FIAT,
    rates: [],
  };

  const createService = (existingAssets: any[]) => {
    const assetRepository = {
      find: jest.fn().mockResolvedValue(existingAssets),
      create: jest.fn((asset) => asset),
      save: jest.fn((asset) =>
        Promise.resolve({ id: 'saved-asset-id', ...asset }),
      ),
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue({ defaultCurrency: 'USD' }),
    };
    const currenciesService = {
      findByCode: jest.fn((code: string) => {
        if (code.toUpperCase() === 'USD') return Promise.resolve(usdCurrency);
        return Promise.reject(new Error('Currency not found'));
      }),
    };

    return {
      service: new AssetsService(
        assetRepository as any,
        userRepository as any,
        currenciesService as any,
      ),
    };
  };

  it('allows selling USD when existing USD holdings were stored without currency_id', async () => {
    const { service } = createService([
      {
        id: 'existing-usd-lot',
        name: 'USD',
        category: AssetCategory.FIAT,
        currency_id: null,
        purchase_price: 1,
        quantity: 3500,
        date: '2026-06-05',
        created_at: '2026-06-05T00:00:00.000Z',
      },
    ]);

    await expect(
      service.create(
        {
          name: 'USD',
          category: AssetCategory.FIAT,
          currency_id: usdCurrency.id,
          purchase_price: 1,
          quantity: -500,
          date: '2026-06-05',
        },
        'user-id',
      ),
    ).resolves.toMatchObject({ quantity: -500 });
  });

  it('rejects selling more USD than the canonical current holding', async () => {
    const { service } = createService([
      {
        id: 'existing-usd-lot',
        name: 'USD',
        category: AssetCategory.FIAT,
        currency_id: null,
        purchase_price: 1,
        quantity: 3500,
        date: '2026-06-05',
        created_at: '2026-06-05T00:00:00.000Z',
      },
    ]);

    await expect(
      service.create(
        {
          name: 'USD',
          category: AssetCategory.FIAT,
          currency_id: usdCurrency.id,
          purchase_price: 1,
          quantity: -4000,
          date: '2026-06-05',
        },
        'user-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
