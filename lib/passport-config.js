const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../models/user');

module.exports = function(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) =>  {
    User.findById(id, done);
  });

  passport.use('local-signin', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, async (req, email, password, done) => {
    try {
      const user = await User.findOne({email: email});
      if (user && await user.validatePassword(password)) {
        return done(null, user, req.flash('success', 'Welcome!'));
      }
      return done(null, false, req.flash('danger', 'Invalid email or password'));
    } catch(err) {
      done(err);
    }
  }));
  
  const callbackURL1 = (process.env.NODE_ENV == 'production') ?
    'https://evening-crag-14820.herokuapp.com/auth/facebook/callback' :
    'http://localhost:3000/auth/facebook/callback';

  const callbackURL2 = (process.env.NODE_ENV == 'production') ?
    'https://evening-crag-14820.herokuapp.com/auth/kakao/callback' :
    'http://localhost:3000/auth/kakao/callback';

  passport.use(new FacebookStrategy({
    // 이 부분을 여러분 Facebook App의 정보로 수정해야 합니다.
    clientID : '140065846749847',
    clientSecret : '0a10e7d0ca417785bbe31fba0d9aa731',
    callbackURL : callbackURL1,
    profileFields : ['email', 'name', 'picture']
  }, async (token, refreshToken, profile, done) => {
    console.log('Facebook', profile); // profile 정보로 뭐가 넘어오나 보자.
    try {
      var email = (profile.emails && profile.emails[0]) ? profile.emails[0].value : '';
      var picture = (profile.photos && profile.photos[0]) ? profile.photos[0].value : '';
      var name = (profile.displayName) ? profile.displayName : 
        [profile.name.givenName, profile.name.middleName, profile.name.familyName]
          .filter(e => e).join(' ');
      console.log(email, picture, name, profile.name);
      // 같은 facebook id를 가진 사용자가 있나?
      var user = await User.findOne({'facebook.id': profile.id});
      if (!user) {
        // 없다면, 혹시 같은 email이라도 가진 사용자가 있나?
        if (email) {
          user = await User.findOne({email: email});
        }
        if (!user) {
          // 그것도 없다면 새로 만들어야지.
          user = new User({name: name});
          user.email =  email ? email : `__unknown-${user._id}@no-email.com`;
        }
        // facebook id가 없는 사용자는 해당 id를 등록
        user.facebook.id = profile.id;
        user.facebook.photo = picture;
      }
      user.facebook.token = profile.token;
      await user.save();
      return done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  passport.use(new KakaoStrategy({
    clientID : 'ec02b38c21fe4ee80f7349389a47789f',
    clientSecret : 'N0ETWH37IPUb8rBswApGmugNxvy0mi7u',
    callbackURL : callbackURL2,
    profileFields : ['email', 'name', 'picture']
  }, async(token, refreshToken, profile, done) => {
    console.log('Kakao', profile);
    try {
      var _profile = profile._json;
      var email = (_profile.kaccount_email) ? _profile.kaccount_email : '';
      var picture = (_profile.profile_image) ? _profile.profile_image : '';
      var name = (_profile.properties.nickname) ? _profile.properties.nickname : '';
      console.log('email : ', email, 'name : ', name);
      // 같은 kakao id를 가진 사용자가 있나?
      var user = await User.findOne({'kakao.id': profile.id});
      if (!user) {
        // 없다면, 혹시 같은 email이라도 가진 사용자가 있나?
        if (email) {
          user = await User.findOne({email: email});
        }
        if (!user) {
           // 그것도 없다면 새로 만들어야지.
          user = new User({name: name});
          user.email =  email ? email : `__unknown-${user._id}@no-email.com`;
        }
         // kakao id가 없는 사용자는 해당 id를 등록
        user.kakao.id = _profile.id;
        user.kakao.photo = picture;
      }
      user.kakao.token = profile.token;
      await user.save();
      return done(null, user);
    } catch (err) {
      done(err);
    }
  }))
};
