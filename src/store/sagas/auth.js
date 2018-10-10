import { put, call, all } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import axios from 'axios';

import * as actions from '../actions';

export function* logoutSaga(action) {
  yield all([
    call([localStorage, 'removeItem'], 'token'),
    call([localStorage, 'removeItem'], 'expirationDate'),
    call([localStorage, 'removeItem'], 'userId'),
    put(actions.logoutSucceed())
  ]);
}

export function* checkAuthTimeoutSaga(action) {
  yield all([
    delay(action.expirationTime * 1000),
    put(actions.logout())
  ]);
}

export function* authUserSaga(action) {
  yield put(actions.authStart());
  const authData = {
    email: action.email,
    password: action.password,
    returnSecureToken: true
  };

  let url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyByG53SxKtsa5RK7ZVNpcUCMOS1LFwKwx4';

  if (!action.isSingup) {
    url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyByG53SxKtsa5RK7ZVNpcUCMOS1LFwKwx4';
  }

  try {
    const response = yield axios.post(url, authData)
    const expirationDate = yield new Date(new Date().getTime() + response.data.expiresIn * 1000);

    yield all([
      localStorage.setItem('token', response.data.idToken),
      localStorage.setItem('expirationDate', expirationDate),
      localStorage.setItem('userId', response.data.localId),
      put(actions.authSuccess(response.data.idToken, response.data.localId)),
      put(actions.checkAuthTimeout(response.data.expiresIn))
    ]);
  } catch (error) {
    yield put(actions.authFail(error.response.data.error));
  }
}

export function* authCheckStateSaga() {
  const token = yield localStorage.getItem('token');
  if (!token) {
    yield put(actions.logout());
  } else {
    const expirationDate = yield new Date(localStorage.getItem('expirationDate'));
    if (expirationDate < new Date()) {
      yield put(actions.logout());
    } else {
      const userId = yield localStorage.getItem('userId');
      yield put(actions.authSuccess(token, userId));
      yield put(actions.checkAuthTimeout((expirationDate.getTime() - new Date().getTime()) / 1000));
    }
  }
}