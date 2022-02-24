/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51KWaalSGCYsF04OcptsbVqV4q88nerDgglTaa47KOtcloeVkYYH6jtc6K3eYGArrgvNjoJKKCcLgs7hGD35cWSUa00DtfZU0Vq'
);

export const bookTour = async (tourID) => {
  try {
    // 1) Get checkout session from Api
    const session = await axios(
      `http://localhost:8080/api/v1/bookings/checkout-session/${tourID}`
    );
    // 2) create checkout from + charge credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
