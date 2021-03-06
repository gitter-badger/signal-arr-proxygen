import _ from 'lodash';
import {toUpperUnderscore} from './utilities';

function _generateActionTypes(hubName, methods, server) {
  const hubUpper = toUpperUnderscore(hubName);
  return methods.map(x => {
    const upper = toUpperUnderscore(x.Name);
    if(server) {
      return [
        `export const ${upper}_REQUEST = ${hubUpper}::${upper}_REQUEST;`,
        `export const ${upper}_RESPONSE = ${hubUpper}::${upper}_RESPONSE;`,
        `export const ${upper}_ERROR = ${hubUpper}::${upper}_ERROR;`
      ].join('\r\n');
    } else {
      return `export const ${upper} = ${hubUpper}::${upper};`;
    }
  }).join('\r\n');
}

function _generateActionCreators(methods, server) {
  return methods.map(x => {
    const upperType = toUpperUnderscore(x.Name);
    const camelAction = _.camelCase(upperType);
    const args = x.Arguments.join(', ');
    const sep = (args.length ? ', ' : '');

    if(server) {
      return [
        `export function ${camelAction}Request(${args}){`,
        `  return {type: ${upperType}_REQUEST${sep}${args}};`,
        `}`,
        `export function ${camelAction}Response(response){`,
        `  return {type: ${upperType}_RESPONSE, response};`,
        `}`,
        `export function ${camelAction}Error(error){`,
        `  return {type: ${upperType}_ERROR, error};`,
        `}`,
        `export function ${camelAction}(${args}){`,
        `  return (dispatch) => {`,
        `    const bound = {`,
        `      ${camelAction}Request(${args}) = dispatch(${camelAction}Request(${args})),`,
        `      ${camelAction}Response(response) = dispatch(${camelAction}Response(response)),`,
        `      ${camelAction}Error(error) = dispatch(${camelAction}Error(error)),`,
        `    };`,
        `    bound.${camelAction}Request(${args});`,
        `    server.${camelAction}`,
        `      .then(bound.${camelAction}Response)`,
        `      .fail(bound.${camelAction}Error);`,
        `  };`,
        `}`
      ].join('\r\n');
    } else {
      return [
        `export function ${camelAction}(${args}){`,
        `  return {type: ${upperType}${sep}${args}};`,
        `}`
      ].join('\r\n');
    }
  }).join('\r\n');
}

function _generateSelfRegistration(hub) {
  const camelHub = _.camelCase(hub.Name);
  const assignments = hub.Client.map(x => {
    const camelAction = _.camelCase(x.Name);
    const args = x.Arguments.join(', ');
    return `  client.${camelAction} = (${args}) => dispatch(${camelAction}(${args}));`
  }).join('\r\n');
  return [
    `export function ${camelHub}(dispatch) {`,
    assignments,
    `}`
  ].join('\r\n');
}


const _generateClientActionTypes = hub => _generateActionTypes(hub.Name, hub.Client, false);
const _generateServerActionTypes = hub => _generateActionTypes(hub.Name, hub.Server, true);
const _generateClientActionCreators = hub => _generateActionCreators(hub.Client, false);
const _generateServerActionCreators = hub => _generateActionCreators(hub.Server, true);

export default function(hub) {
  return [
    `/** Start ${hub.Name} **/`,
    `// Generated by the signal-arr Redux Classic (jQuery based) proxy generator.`,
    `let {server, client} = $.connection.${_.camelCase(hub.Name)};`,
    '',
    `// Action Types (Client)`,
    `${_generateClientActionTypes(hub)}`,
    '',
    `// Action Types (Server)`,
    `${_generateServerActionTypes(hub)}`,
    '',
    `// Action Creators (Client)`,
    `${_generateClientActionCreators(hub)}`,
    '',
    `// Action Creators (Server)`,
    `${_generateServerActionCreators(hub)}`,
    '',
    `// Self Registration`,
    `${_generateSelfRegistration(hub)}`,
    '',
    `/** End ${hub.Name} **/`,
    ''
  ].join('\r\n');
}