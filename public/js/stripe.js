/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51OVraHSAYLYE76ZDIbrVX4jAYPuPwBkjxg4LM2XBvoCUztzlDetdMzXQi1LlIpUekmrs0HYFQ7D0Em5qINcd58Aa00MaljjVTK'
);

export const bookTour = async (tourId) => {
  try {
    //1)Get checkout session from the end point of api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    //2)Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    showAlert('error', err);
  }
};
