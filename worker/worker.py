
import os, time, redis
r = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), decode_responses=True)
print("POLARIS worker online")
while True:
    job = r.brpop("polaris:jobs", timeout=5)
    if job:
        _, payload = job
        print(f"Processing job: {payload}")
    time.sleep(0.5)
