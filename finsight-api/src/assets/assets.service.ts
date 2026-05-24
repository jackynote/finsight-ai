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

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  async create(createAssetDto: CreateAssetDto, userId: string) {
    const asset = this.assetRepository.create({
      ...createAssetDto,
      user_id: userId,
      date: createAssetDto.date || new Date().toISOString().split('T')[0],
    });
    return this.assetRepository.save(asset);
  }

  async findAll(userId: string) {
    return this.assetRepository.find({
      where: { user_id: userId },
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
