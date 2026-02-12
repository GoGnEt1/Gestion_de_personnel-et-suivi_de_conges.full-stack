import os
from hypercorn.config import Config
from hypercorn.asyncio import serve
import asyncio

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "staf_manag.settings")

from staf_manag.asgi import application

async def main():
    config = Config()
    config.bind = ["127.0.0.1:8000"]

    # Sécurité & proxy
    config.forwarded_allow_ips = "*"
    config.proxy_headers = True

    # Performances raisonnables pour un intranet
    config.workers = 2
    config.keep_alive_timeout = 30

    await serve(application, config)


if __name__ == "__main__":
    asyncio.run(main())
