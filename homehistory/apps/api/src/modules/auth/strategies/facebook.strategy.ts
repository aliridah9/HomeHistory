import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { getConfig } from '../../../config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    const config = getConfig();
    super({
      clientID: config.oauth.facebook.appId,
      clientSecret: config.oauth.facebook.appSecret,
      callbackURL: config.oauth.facebook.callbackUrl,
      scope: ['email', 'public_profile'],
      profileFields: ['emails', 'name', 'photos'],
      state: true, // Enable CSRF protection
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
      accessToken,
      refreshToken,
      provider: 'facebook',
      providerId: profile.id,
    };
    // Do not throw here; controller will handle missing email with a 401 JSON
    done(null, user);
  }
}
