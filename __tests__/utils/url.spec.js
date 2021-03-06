import {
  apiRequest,
  apiUrl,
  defaultProfileImage,
  termsAndConditionsUrl,
  ServerError,
  TokenInvalidError,
} from '../../app/utils/url';

const fetchPromiseResult = {
  status: 200,
  json: () => Promise.resolve({ exampleJson: 'val' }),
};

describe('url helper', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockReturnValue(Promise.resolve(fetchPromiseResult));
  });

  it('should expose the constants', () => {
    // eslint-disable-next-line global-require
    const { url } = require('../../app/utils/url');
    expect(url).toEqual('http://localhost:8000');
    expect(apiUrl).toEqual('http://localhost:8000/api/v1');
    expect(defaultProfileImage).toEqual(
      'http://localhost:8000/static/members/images/default-avatar.jpg'
    );
    expect(termsAndConditionsUrl).toEqual(
      'http://localhost:8000/event-registration-terms/'
    );
  });

  it('should do a fetch request', () => {
    expect.assertions(2);
    return apiRequest('route', {}, null).then((response) => {
      expect(global.fetch).toBeCalledWith(`${apiUrl}/route/`, { headers: {} });
      expect(response).toEqual({ exampleJson: 'val' });
    });
  });

  it('should do a fetch request with params', () => {
    expect.assertions(1);
    return apiRequest(
      'route',
      {},
      {
        params: 'value',
      }
    ).then(() => {
      expect(global.fetch).toBeCalledWith(`${apiUrl}/route/?params=value`, {
        headers: {},
      });
    });
  });

  it('should do a fetch request with headers', () => {
    expect.assertions(1);
    return apiRequest('route', { headers: { Authorization: 'Token abc' } }, null).then(
      () => {
        expect(global.fetch).toBeCalledWith(`${apiUrl}/route/`, {
          headers: { Authorization: 'Token abc' },
        });
      }
    );
  });

  it('should generate the url parameters', () => {
    expect.assertions(2);
    return apiRequest('route', {}, null).then((response) => {
      expect(global.fetch).toBeCalledWith(`${apiUrl}/route/`, { headers: {} });
      expect(response).toEqual({ exampleJson: 'val' });
    });
  });

  it('should throw a server error', () => {
    expect.assertions(1);
    const response = {
      status: 404,
      json: () => Promise.resolve('responseJson'),
    };
    global.fetch.mockReturnValue(Promise.resolve(response));
    return apiRequest('route', {}, null).catch((e) =>
      expect(e).toEqual(new ServerError('Invalid status code: 404', response))
    );
  });

  it('should return an empty response on status 204', () => {
    expect.assertions(1);
    const response = {
      status: 204,
      json: () => Promise.resolve('responseJson'),
    };
    global.fetch.mockReturnValue(Promise.resolve(response));
    return apiRequest('route', {}, null).then((res) => expect(res).toEqual({}));
  });

  it('should detect an invalid token in English', () => {
    expect.assertions(1);
    const response = {
      status: 403,
      json: () => Promise.resolve({ detail: 'Invalid token.' }),
    };
    global.fetch.mockReturnValue(Promise.resolve(response));
    return apiRequest('route', {}, null).catch((e) =>
      expect(e).toEqual(new TokenInvalidError('responseCopy'))
    );
  });

  it('should not falsely claim the token is incorrect', () => {
    expect.assertions(1);
    const response = {
      status: 403,
      headers: { get: (key) => (key === 'content-language' ? 'en' : 'nl') },
      json: () => Promise.resolve({ detail: 'Not authorized.' }),
    };
    global.fetch.mockReturnValue(Promise.resolve(response));
    return apiRequest('route', {}, null).catch((res) =>
      expect(res).toEqual(new ServerError('Invalid status code: 403'))
    );
  });

  it('should use the correct url when in production mode', () => {
    jest.resetModules();
    // eslint-disable-next-line no-underscore-dangle
    global.__DEV__ = false;
    // eslint-disable-next-line global-require
    const { url } = require('../../app/utils/url');
    expect(url).toEqual('https://thalia.nu');
  });
});
