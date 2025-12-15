import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel } from '@grafana/faro-web-sdk';
import { removePII, validatePIICompliance } from '@coffeeandfun/remove-pii';
import { log } from './logger';
import { SEARCH_TRACKING_MAX_LENGTH, SEARCH_TRACKING_SOURCE } from './constants';
import { initSearchTracking, processSearchTerm, setTrackFn, trackSearch } from './search';
import { RudderStack } from './types';

vi.mock('@theme-original/SearchBar/lunar-search', () => ({ default: vi.fn() }));
vi.mock('@coffeeandfun/remove-pii', () => ({ removePII: vi.fn(), validatePIICompliance: vi.fn() }));
vi.mock('./logger', () => ({ log: vi.fn() }));

beforeEach(() => {
  setTrackFn();
  vi.clearAllMocks();
  vi.mocked(validatePIICompliance).mockReturnValue({ isCompliant: true, violationCount: 0 });
  vi.mocked(removePII).mockImplementation((str) => str);
  vi.mocked(log).mockImplementation(() => {});
});

describe('processSearchTerm', () => {
  it('should truncate the input if its larger than threshold', () => {
    const input = 'a'.repeat(SEARCH_TRACKING_MAX_LENGTH + 10);

    const result = processSearchTerm(input);

    expect(result).toEqual('a'.repeat(SEARCH_TRACKING_MAX_LENGTH));
    expect(validatePIICompliance).toHaveBeenCalledExactlyOnceWith(result);
    expect(removePII).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('should log and remove PII if the input contains PII', () => {
    const input = 'searching for someone@test.org';
    vi.mocked(validatePIICompliance).mockReturnValue({ isCompliant: false, violationCount: 1 });
    vi.mocked(removePII).mockReturnValue('searching for [email removed]');

    const result = processSearchTerm(input);

    expect(result).toEqual('searching for [email removed]');
    expect(validatePIICompliance).toHaveBeenCalledExactlyOnceWith(input);
    expect(removePII).toHaveBeenCalledExactlyOnceWith(input);
    expect(log).toHaveBeenCalledExactlyOnceWith(`PII detected: 1 violations`, LogLevel.WARN);
  });

  it('should sanitize string', () => {
    const input = `<script>alert('xss)</script>`;

    const result = processSearchTerm(input);

    expect(result).toEqual('&lt;script&gt;alert(&#x27;xss)&lt;&#x2F;script&gt;');
    expect(validatePIICompliance).toHaveBeenCalledExactlyOnceWith(input);
    expect(removePII).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
});

describe('trackSearch', () => {
  it('should log warning if trackFn is not set', () => {
    setTrackFn();

    trackSearch('', 0);

    expect(log).toHaveBeenCalledExactlyOnceWith(`RudderStack not initialized, skipping search tracking`, LogLevel.WARN);
  });

  it('should call trackFn when trackFn is set', () => {
    const mock = vi.fn();
    setTrackFn(mock);

    trackSearch('plugin', 5);

    expect(log).not.toHaveBeenCalled();
    expect(mock).toHaveBeenCalledExactlyOnceWith(SEARCH_TRACKING_SOURCE, {
      searchTerm: 'plugin',
      searchResultCount: 5,
    });
  });
});

describe('initSearchTracking', () => {
  it.each([
    { rudder: undefined, msg: 'RudderStack not initialized, skipping search tracking', level: LogLevel.WARN },
    { rudder: null, msg: 'RudderStack not initialized, skipping search tracking', level: LogLevel.WARN },
    { rudder: {}, msg: 'RudderStack not initialized, skipping search tracking', level: LogLevel.WARN },
    {
      rudder: { track: undefined },
      msg: 'RudderStack not initialized, skipping search tracking',
      level: LogLevel.WARN,
    },
    {
      rudder: { track: null },
      msg: 'RudderStack not initialized, skipping search tracking',
      level: LogLevel.WARN,
    },
    {
      rudder: { track: vi.fn() },
      msg: 'Search tracking initialized successfully',
      level: LogLevel.INFO,
    },
  ])(`should log $msg with level $level when rudderstack object is $rudder`, ({ rudder, msg, level }) => {
    initSearchTracking(rudder as Partial<RudderStack>);

    expect(log).toHaveBeenCalledExactlyOnceWith(msg, level);
  });

  it('should log warning message if called twice', () => {
    const rudder = { track: vi.fn() } as Partial<RudderStack>;

    initSearchTracking(rudder);
    initSearchTracking(rudder);

    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(1, 'Search tracking initialized successfully', LogLevel.INFO);
    expect(log).toHaveBeenNthCalledWith(2, 'Search tracking already initialized', LogLevel.WARN);
  });
});
