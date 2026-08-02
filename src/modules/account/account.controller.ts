import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AccountService } from '@/modules/account/account.service';
import { DeleteAccountDto } from '@/modules/auth/dto/delete-account.dto';
import { UpdateProfileDto } from '@/modules/account/dto/update-profile.dto';
import { ChangePasswordDto } from '@/modules/account/dto/change-password.dto';
import { UserMeResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  ApiSingleResponse,
  ApiNoDataResponse,
} from '@/common/decorators/swagger-response.decorator';
import { Throttle } from '@nestjs/throttler';
import { AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS } from '@/constants/time';

@ApiTags('Account')
@Controller('account')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('profile')
  @ResponseMessage('Get account profile successfully')
  @ApiOperation({
    summary: 'Get User Profile',
    description:
      'Fetches profile metadata for the authenticated user alongside their active logged-in device sessions list.',
  })
  @ApiSingleResponse(
    UserMeResponseDto,
    HttpStatus.OK,
    'Get account profile successfully',
    '/api/v1/account/profile'
  )
  async getProfile(@Req() req: any): Promise<UserMeResponseDto> {
    return this.accountService.getProfile(req.user.id);
  }

  @Put('update/profile')
  @ResponseMessage('Update account profile successfully')
  @ApiOperation({
    summary: 'Update User Profile',
    description:
      'Updates profile metadata (display name and/or avatar URL) for the authenticated user.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiSingleResponse(
    UserMeResponseDto,
    HttpStatus.OK,
    'Update account profile successfully',
    '/api/v1/account/update/profile'
  )
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any): Promise<UserMeResponseDto> {
    return this.accountService.updateProfile(req.user.id, dto);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Delete account successfully')
  @ApiOperation({
    summary: 'Delete Account',
    description:
      "Permanently deletes the authenticated user's account and all associated data. Requires password confirmation to prevent accidental or unauthorised deletion.",
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Delete account successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Incorrect password or user not found.',
  })
  async deleteAccount(
    @Body() dto: DeleteAccountDto,
    @Req() req: any,
    @Res({ passthrough: true }) res?: Response
  ): Promise<void> {
    return this.accountService.deleteAccount(req.user.id, dto.password, res);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } })
  @ResponseMessage('Change password successfully')
  @ApiOperation({
    summary: 'Change Password',
    description:
      "Verifies the user's current password and updates it to a new password. Revokes all active refresh sessions to force re-login.",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiNoDataResponse(
    HttpStatus.OK,
    'Change password successfully',
    '/api/v1/account/change-password'
  )
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Incorrect current password.',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: any
  ): Promise<{ message: string }> {
    return this.accountService.changePassword(req.user.id, dto);
  }
}
