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
    "SearchParameter": {
        "User.active": {
            "name": "active",
            "expression": [["active"]],
            "type": "token",
            "resource": {
                "resourceType": "Entity",
                "id": "User"
            }
        },
    }
}

sdk = SDK(settings, resources=resources)


async def create_app():
    return await _create_app(settings, sdk, debug=True)


@sdk.operation(["GET"], ["sync-questionnaire", {"name": "id"}], public=False)
async def sync_questionnaire_operation(operation, request):
    await sync_questionnaire(
        await sdk.client.resources('Questionnaire').get(
            id=request["route-params"]["id"]))
    return web.json_response({})

@sdk.subscription("Questionnaire")
async def sync_questionnaire_subscription(event):
    await sync_questionnaire(
        sdk.client.resource("Questionnaire",
                            **event["resource"]))


async def sync_questionnaire(questionnarie):
    logging.debug("Sync questionnaire %s", questionnarie)

    search_query = sdk.client.resource("SearchQuery", **{
        "id": questionnarie["id"],
        "resource": {
            "id": "QuestionnaireResponse",
            "resourceType": "Entity",
        },
        "as": "qr",
        "total": True,
        "query": {
            "where": "qr.resource->>'questionnaire' = '{}'".format(
                questionnarie['id'])

        },
        "params": {
        },
    })

    for item in questionnarie['item']:
        logging.debug(item['linkId'])
        if item['type'] == 'string':
            search_query["params"][item["linkId"]] = {
                "type": "string",
                "format": '%?%',
                "where": """(knife_extract(resource, '[["item",{{"linkId": "{}"}}, "answer", "value", "string"]]'))[1]::text ilike {{{{params.{}}}}} """.format(
                    item["linkId"], item["linkId"])
            }

    await search_query.save()

    logging.debug("SearchQuery %s", search_query)
