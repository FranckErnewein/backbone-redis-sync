local namespace = KEYS[1]
local json = cjson.decode(ARGV[1])

--
if not json['id'] then
  json['id'] = redis.call('INCR', namespace .. '_uniq_id')
end

local key = namespace .. ':' .. tostring(json['id'])

for k, v in pairs(json) do
  redis.call('HSET', key, k, tostring(v));
end

local json_string = cjson.encode(json)
redis.call('PUBLISH', key .. '#save', json_string)

return json_string;
