import sqlalchemy as sa
import logging
import coloredlogs
import time
import asyncio
from aiohttp import web
from datetime import datetime
from sqlalchemy.sql.expression import select, insert

from aidbox_python_sdk.main import create_app as _create_app
from aidbox_python_sdk.settings import Settings
from aidbox_python_sdk.sdk import SDK
from aidbox_python_sdk.handlers import routes

logger = logging.getLogger()
coloredlogs.install(level='DEBUG', fmt='%(asctime)s %(levelname)s %(message)s')

settings = Settings(**{})
resources = {
    'Client': {
        'SPA': {
            'secret': '123456',
            'grant_types': ['password']
        }
    },
    'User':
        {
            'superadmin':
                {
                    'email': 'superadmin@example.com',
                    'password': '12345678',
                }
        },
    'AccessPolicy':
        {
            'superadmin':
                {
                    'engine': 'json-schema',
                    'schema': {
                        'required': ['user']
                    }
                }
        },
}

sdk = SDK(settings, resources=resources)


async def create_app():
    return await _create_app(settings, sdk, debug=True)
