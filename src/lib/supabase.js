const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';

function joinUrl(base, path) {
  const trimmedBase = String(base || '').replace(/\/$/, '');
  return `${trimmedBase}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(joinUrl(API_BASE, path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }
  return payload;
}

function buildQuery(searchParams = []) {
  return searchParams.length ? `?${new URLSearchParams(searchParams).toString()}` : '';
}

class ApiQueryBuilder {
  constructor(table) {
    this.table = table;
    this.method = 'GET';
    this.payload = null;
    this.filters = [];
    this.sortField = null;
    this.sortAscending = true;
    this.limitValue = null;
    this.singleMode = null;
    this.selectClause = '*';
  }

  select(columns = '*') {
    this.selectClause = columns;
    return this;
  }

  insert(payload) {
    this.method = 'POST';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.method = 'PATCH';
    this.payload = payload;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(field, value) {
    this.filters.push(['eq', field, String(value)]);
    return this;
  }

  in(field, values) {
    this.filters.push(['in', field, values.join('|')]);
    return this;
  }

  order(field, options = {}) {
    this.sortField = field;
    this.sortAscending = options.ascending !== false;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const query = [
      ['select', this.selectClause],
      ['sortField', this.sortField || ''],
      ['sortAscending', this.sortAscending ? '1' : '0'],
      ['limit', this.limitValue ? String(this.limitValue) : ''],
      ['singleMode', this.singleMode || ''],
      ...this.filters.map(([type, field, value]) => [`f_${type}_${field}`, value]),
    ].filter(([, value]) => value !== '');

    const options = {
      method: this.method,
      body: this.method === 'GET' ? undefined : JSON.stringify(this.payload),
    };

    const path = `/api/neon/${encodeURIComponent(this.table)}${buildQuery(query)}`;
    const payload = await request(path, options);
    return {
      data: payload.data ?? null,
      error: payload.error ? { message: payload.error } : null,
      count: Array.isArray(payload.data) ? payload.data.length : payload.data ? 1 : 0,
    };
  }
}

class ApiChannel {
  on() {
    return this;
  }

  subscribe() {
    return this;
  }
}

export const supabase = {
  from(table) {
    return new ApiQueryBuilder(table);
  },
  channel() {
    return new ApiChannel();
  },
  removeChannel() {
    return undefined;
  },
  auth: {
    getSession: async () => request('/api/neon/auth/session'),
    onAuthStateChange: (callback) => {
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    signUp: async ({ email, password, options }) => request('/api/neon/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, options }),
    }),
    signInWithPassword: async ({ email, password }) => request('/api/neon/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    signInWithOAuth: async ({ provider, options }) => request('/api/neon/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider, options }),
    }),
    resetPasswordForEmail: async (email, options) => request('/api/neon/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, options }),
    }),
    updateUser: async ({ password }) => request('/api/neon/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
    signOut: async () => request('/api/neon/auth/logout', { method: 'POST' }),
  },
};
