import React, { useEffect } from 'react'


function CreateRecovery(props: any) {
  let action = (props.url_prefix || 'https://centeridentity.com') + '/identity';
  return (
    <form method='GET' action={action}>
      <input type='hidden' name='api_key' value={props.apiKey}/>
      <input type='hidden' name='next' value={props.returnToUrl}/>
      <input type='hidden' name='mode' value='create'/>
      {props.children}
    </form>
  )
}

export default CreateRecovery