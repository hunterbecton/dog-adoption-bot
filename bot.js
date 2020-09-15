const dotenv = require('dotenv');
const petfinder = require('@petfinder/petfinder-js');
const Twitter = require('twitter');

dotenv.config({ path: './config.env' });

const petClient = new petfinder.Client({
  apiKey: process.env.PF_API_KEY,
  secret: process.env.PF_SECRET_KEY,
});

var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});

const newDogsThisHour = async () => {
  const hourago = new Date(new Date().getTime() - 1000 * 60 * 60);

  let dogsWithPhotos = [];

  try {
    const apiResult = await petClient.animal.search({
      type: 'Dog',
      location: '30303',
      distance: 100,
      after: hourago,
    });

    const animals = apiResult.data.animals;

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

shareDog(); // Run function when server starts

setInterval(shareDog, 1000 * 60 * 60); // Run function every hour
