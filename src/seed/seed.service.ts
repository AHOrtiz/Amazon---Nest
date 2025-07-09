import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { initialData } from './data/seed-data';
import { ProductsService } from './../products/products.service';
import { CategoriesService } from 'src/categories/categories.service';
import { AuthService } from 'src/auth/auth.service';
import { BannersService } from 'src/banners/banners.service';
import { BrandService } from 'src/brand/brand.service';
import { ShoppingCartService } from 'src/shopping-cart/shopping-cart.service';

import { User } from '../auth/entities/user.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Product } from 'src/products/entities/product.entity';
import { Banner } from 'src/banners/entities/banner.entity';
import { Brand } from 'src/brand/entities/brand.entity';


@Injectable()
export class SeedService {

  private readonly logger = new Logger('SeedService');

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly bannersService: BannersService,
    private readonly authService: AuthService,
    private readonly brandService:BrandService,
    private readonly shoppingCartService: ShoppingCartService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>
  ) {}

  private user: User = new User();
  private productName: string = "";

  async runSeed() {
    await this.deleteTables();
    await this.insertUsers();
    await this.insertCategories();
    await this.insertBrand();
    await this.insertBanners();
    await this.insertProducts();
    await this.insertShoppingCart();
    return 'BASE DE DATOS LLENADA CORRECTAMENTE';
  }

  private async deleteTables() {
    await this.authService.deleteAllUsers();
    await this.productsService.deleteAllProducts();
    await this.bannersService.deleteAll();
    await this.categoriesService.deleteAllCategories();
    await this.brandService.deleteAll();
    await this.shoppingCartService.deleteAll();

    const queryBuilderUsers = this.userRepository.createQueryBuilder();

    await queryBuilderUsers.delete()
                      .where({})
                      .execute()
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];

    seedUsers.forEach((user) => {
      users.push(this.userRepository.create(user))
    });

    const response = await this.userRepository.save(seedUsers)
    this.user = users[0];
    return response
  }

  private async insertShoppingCart() {
    const user = await this.userRepository.findOneBy({ id: this.user.id });
    const product = await this.productRepository.findOneBy({ name: this.productName });
    const quantity: number = 2;

    return await this.shoppingCartService.create(user!.id, {
      product: {
        productId: product!.id,
        quantity
      }
    })
  }

  private async insertBanners() {
    const user = await this.userRepository.findOneBy({ id: this.user.id });
    const banners = initialData.banners;
    const insertPromises: Promise<Banner>[] = [];

    banners.forEach((banner) => {
      insertPromises.push(this.bannersService.create(user!.id, banner));
    });

    return await Promise.all(insertPromises);
  }

  private async insertCategories() {
    const user = await this.userRepository.findOneBy({ id: this.user.id });
    const categories = initialData.categories;
    const insertPromises: Promise<Category>[] = [];

    categories.forEach((category) => {
      insertPromises.push(this.categoriesService.create(user!.id, category));
    });

    await Promise.all(insertPromises);
    return true;
  }

  private async insertBrand(){
    const brands = initialData.brand;
    const insertPromises: Promise<Brand>[] = [];

    brands.forEach((brand)=>{
      insertPromises.push(this.brandService.create(brand));
    });

    return await Promise.all(insertPromises);
  }

  private async insertProducts() {
    const products = initialData.products;
    const insertPromises: Promise<Product>[] = [];

    products.forEach((product) => {
      insertPromises.push(this.productsService.create(product));
    });

    this.productName = initialData.products[0].name

    return await Promise.all(insertPromises);    
  }
}