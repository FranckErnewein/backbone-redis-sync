local key = KEYS[1] .. ':' .. ARGV[1];

redis.call('DEL', key);
redis.call('PUBLISH', key..'#delete', 0);

