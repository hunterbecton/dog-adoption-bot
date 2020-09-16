const dotenv = require('dotenv');
const Twitter = require('twitter');
const fetch = require('node-fetch');

dotenv.config({ path: './config.env' });

const twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});

const newDogsThisHour = async () => {
  const hourAgo = new Date(new Date().getTime() - 1000 * 60 * 60).toISOString();

  let dogsWithPhotos = [];

  try {
    const tokenRes = await fetch('https://api.petfinder.com/v2/oauth2/token', {
      method: 'POST',
      body: `grant_type=client_credentials&client_id=${process.env.PF_API_KEY}&client_secret=${process.env.PF_SECRET_KEY}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = await tokenRes.json();

    const dogsRes = await fetch(
      `https://api.petfinder.com/v2/animals?type=dog&location=30303&distance=100&after=${hourAgo}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { animals } = await dogsRes.json();

    if (animals.length === 0) {
      return null;
    }

    if (animals.length > 0) {
      // Filter dogs with photos
      dogsWithPhotos = animals.filter((animal) => animal.photos.length > 0);

      return dogsWithPhotos;
    }
  } catch (error) {
    console.log(error);
  }
};

const shareDog = async () => {
  const newDogs = await newDogsThisHour();

  if (newDogs) {
    twitterClient.post(
      'statuses/update',
      {
        status: `I'm looking for a home! 🐶 ${newDogs[0].url}`,
      },
      function (error, tweet, response) {
        if (!error) {
          console.log(tweet);
        }
        if (error) {
          console.log(error);
        }
      }
    );
  }
};

// Share when server starts
shareDog();

setInterval(shareDog, 1000 * 60 * 60); // Share every hour afterwards
