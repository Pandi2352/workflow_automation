import { Controller, Get, Post, Body, Query, Delete, Param } from '@nestjs/common';
import { CredentialsService } from './credentials.service';

@Controller('credentials')
export class CredentialsController {
    constructor(private readonly credentialsService: CredentialsService) { }

    @Get()
    async findAll(@Query('provider') provider?: string) {
        const credentials = await this.credentialsService.findAll();
        if (provider) {
            return credentials.filter(c => c.provider === provider);
        }
        return credentials;
    }

    @Post()
    async create(@Body() createCredentialDto: any) {
        return this.credentialsService.create(createCredentialDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.credentialsService.delete(id);
    }
}
