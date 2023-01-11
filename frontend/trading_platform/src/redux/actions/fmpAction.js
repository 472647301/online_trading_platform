import axios from "axios";
import * as actionTypes from "../types";

export const getProfile = symbol => (dispatch, state) => {
  axios
    .get(`https://financialmodelingprep.com/api/v3/company/profile/${symbol}?apikey=75761700ce53efd4d1532f16682d59d0`)
    .then(res => {
      dispatch({
        type: actionTypes.GET_COMPANY_PROFILE,
        payload: res.data
      });
    })
    .catch(err => {
      console.log(err);
    });
};
