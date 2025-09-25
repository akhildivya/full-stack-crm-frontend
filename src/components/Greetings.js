import React from 'react';
import '../css/greeting.css'

const Greeting = () => {
  const hours = new Date().getHours();
  let greetingMessage = '';
  let timeOfDayClass = '';

  if (hours < 12) {
    greetingMessage = 'Good Morning';
    timeOfDayClass = 'morning';
  } else if (hours < 17) {
    greetingMessage = 'Good Afternoon';
    timeOfDayClass = 'afternoon';
  } else if (hours < 21) {
    greetingMessage = 'Good Evening';
    timeOfDayClass = 'evening';
  } else {
    greetingMessage = 'Good Night';
    timeOfDayClass = 'night';
  }

  return <h2 className={`greeting ${timeOfDayClass}`}>{greetingMessage}</h2>;
};

export default Greeting;
