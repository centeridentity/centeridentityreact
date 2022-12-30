import React, { useEffect } from 'react'


function RecoverAccount(props: any) {
  let action = (props.url_prefix || 'https://centeridentity.com') + '/identity';
  return (
    <form method='GET' action={action}>
      <input type='hidden' name='api_key' value={props.apiKey}/>
      <input type='hidden' name='next' value={props.returnToUrl}/>
      <input type='hidden' name='mode' value='recover'/>
      {props.children}
    </form>
  )
}

export default RecoverAccount