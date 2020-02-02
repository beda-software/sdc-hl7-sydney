import sqlalchemy as sa
import logging
import coloredlogs
import time
import asyncio
import aiohttp
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
    'AccessPolicy': {
        'superadmin': {
            'engine': 'json-schema',
            'schema': {
                'required': ['user']
            }
        },
        'questionnaire-public': {
            'engine': 'json-schema',
            'schema': {
                "properties": {
                    "params": {
                        "required": [
                            "resource/type",
                            "resource/id",
                        ],
                        "properties": {
                            "resource/type": {
                                "constant": "Questionnaire",
                            },
                        }
                    }
                }
            }
        },
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
    },
    'Attribute': {
        'Questionnaire.sourceQueries': {
            'type': {'resourceType': 'Entity',  'id': 'Reference'},
            'path': ['sourceQueries'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-sourceQueries',
        },
        'Questionnaire.launchContext': {
            # 'type': {'resourceType': 'Entity',  'id': 'string'},
            'path': ['launchContext'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext',
            # 'isCollection': True,
        },
        'Questionnaire.launchContext.name': {
            'type': {'resourceType': 'Entity',  'id': 'id'},
            'path': ['launchContext', 'name'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'name',
        },
        'Questionnaire.launchContext.type': {
            'type': {'resourceType': 'Entity',  'id': 'code'},
            'path': ['launchContext', 'type'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'type',
        },
        'Questionnaire.launchContext.description': {
            'type': {'resourceType': 'Entity',  'id': 'string'},
            'path': ['launchContext', 'description'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'description',
        },
        'Questionnaire.item.initialExpression': {
            'type': {'resourceType': 'Entity',  'id': 'Expression'},
            'path': ['item', 'initialExpression'],
            'resource': {'resourceType': 'Entity', 'id': 'Questionnaire'},
            'extensionUrl': 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression',
        },
    },
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
        elif item['type'] == 'integer':
            search_query["params"][item["linkId"]] = {
                "type": "integer",
                "where": """(knife_extract(resource, '[["item",{{"linkId": "{}"}}, "answer", "value", "integer"]]'))[1]::integer = {{{{params.{}}}}} """.format(
                    item["linkId"], item["linkId"])
            }

    await search_query.save()

    logging.debug("SearchQuery %s", search_query)


async def handle_item(item, env, fhir_format):
    root = {"linkId": item["linkId"], "text": item["text"]}
    if 'initialExpression' in item:
        try:
            async with aiohttp.ClientSession() as session:
                resp = await session.post('http://fhirpath.hl7.beda.software/',
                                        json={
                                            "data": {},
                                            "expr": item['initialExpression']['expression'],
                                            "env": env,
                                        })
                if resp.status == 200:
                    data = (await resp.json())['data']
                    if len(data):
                        if fhir_format:
                            t = "value{}".format(item["type"].capitalize())
                            root["answer"] = [{t: data[0]}]
                        else:
                            root["answer"] = [{"value": {item['type']: data[0]}}]
        except aiohttp.web.HTTPException:
            pass
    if 'item' in item:
        root["item"] = []
        for i in item['item']:
            root["item"].append(await handle_item(i, env, fhir_format))

    return root


async def populate_questionnaire(request, fhir_format=False):
    env = {}
    for param in request['resource']['parameter']:
        if 'resource' in param:
            env[param['name']] = param['resource']

    questionnaire = await sdk.client.resources('Questionnaire').get(
        id=request["route-params"]["id"])
    root = {
        "resourceType": "QuestionnaireResponse",
        "item": []
    }
    for item in questionnaire['item']:
        root['item'].append(await handle_item(item, env, fhir_format))

    return web.json_response(root)

@sdk.operation(["POST"],
               ["fhir", "Questionnaire", {"name": "id"}, "$populate"],
               public=True)
async def populate_questionnaire_fhir(operation, request):
    return await populate_questionnaire(request, True)

@sdk.operation(["POST"],
               ["Questionnaire", {"name": "id"}, "$populate"],
               public=True)
async def populate_questionnaire_aidbox(operation, request):
    return await populate_questionnaire(request, False)

