import { Form, ActionPanel, Action, showToast, LocalStorage } from "@raycast/api";

import { useEffect, useState } from "react";
import { useFetch } from "@raycast/utils";
type ticketInputDataType = {
  name: string;
  remote?: boolean | null ;
  location?: string | null ;
  worker?: string | null ;
  client_id?: string | null ;
  priority?: string;
  custom_ticket_id?: string | null ;
  description?: string | null ;
  reference?: string | null ;
  attachments?: string[] | null ;
  tags?: string | null  | string[];
};
type Values = {
  name: string;
  description: string;
  tags: string[];
};

export default   function Command() {
 const [hasEnv, setHasEnv] = useState(false)
 const [ticket,setTicket] = useState<ticketInputDataType>({
    name: '',
    description: '',
    tags: []
 })
 const [envValues, setEnvValues] = useState({
    apiKey:'',
    workspaceId:''
  })
  const workspaceInfo = useFetch<{data:{workspace:any}}>("https://api.starko.one/one/api/v1/workspace-api",{
    credentials: "include",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "starko-api-key":  envValues.apiKey || "",
      "starko-workspace-id": envValues.workspaceId || "",
    },
    execute: hasEnv,
    onError: (error)=>{
      showToast({ title: "Error", message: error.message });
      if(error.message === "Unauthorized"){
        console.log(error.message)
        showToast({ title: "Error", message: "Please check your api key and workspace ID" });
        setHasEnv(false)
      }
    }
   
  })

  const createTicket  =  useFetch("https://api.starko.one/one/api/v1/workspace-api",{
     credentials: "include",
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "starko-api-key": envValues.apiKey,
       "starko-workspace-id": envValues.workspaceId,
     },
     keepPreviousData: false,
     execute: false,
     onData: (data)=>{
        showToast({ title: "Ticket created", message: "Ticket has been created successfully" });
        setTicket({
          name: '',
          description: '',
          tags: []
        })
     },
     onError: (error)=>{
      showToast({ title: "Error", message: error.message });
     },
     body: JSON.stringify({
      ...ticket
     })})
 const checkEnv = async () =>{
  const apiKey = await LocalStorage.getItem("starko-api-key")
  const workspaceId = await LocalStorage.getItem("starko-workspace-id")
  setEnvValues({
    apiKey: apiKey as string,
    workspaceId: workspaceId as string
  })

 workspaceInfo.revalidate()
 
  if(apiKey && workspaceId){
    
    setHasEnv(true)
  }
}
  useEffect(()=>{
    checkEnv() 
  },[])



  async function  handleSubmit(values: Values) {
    showToast({ title: "Submitted form", message: "See logs for submitted values" });
    if(!ticket){
      showToast({ title: "Error", message: "Please fill in the form" });
      return
    }

    createTicket.mutate()

  }

  async function handleCreateEnv(values: {
    apiKey: string;
    workspaceId: string;
  }){
    await LocalStorage.setItem("starko-api-key", values.apiKey)
    await LocalStorage.setItem("starko-workspace-id", values.workspaceId)
    setHasEnv(true)
    showToast({ title: "Env variables created", message: "You can now create tickets" });
  }



  if(!hasEnv){
    return <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleCreateEnv} />
        </ActionPanel>
      }
    >
      <Form.Description  text="This form showcases all available form elements." />
      <Form.TextField id="apiKey" title="Ticket name" placeholder="Enter your api key" />
      <Form.TextField id="workspaceId" title="Text area" placeholder="Enter your workspace ID" />
      
    </Form>
  }else return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={workspaceInfo.isLoading || createTicket.isLoading}
    >
      <Form.Description  text={ 'You are currently in '+workspaceInfo?.data?.data.workspace.name|| ''} />
      <Form.TextField onChange={(value)=>{
        setTicket({
          ...ticket,
          name: value
        })
      }} value={ticket?.name || ""} id="name" title="Ticket name" placeholder="Enter text"   />
      <Form.TextArea 
        onChange={(value)=>{
          setTicket((current)=>{
            return {
              ...current,
              description: value}
          })
        }}
      value={ticket?.description || ""} id="description" title="Text area" placeholder="Enter multi-line text"  />
      <Form.TagPicker
        onChange={(value)=>{
          setTicket((current)=>{
            return {
              ...current,
              tags: value}
          })
        }}
      value={ticket?.tags as string[] || undefined} id="tags" title="Tags">
        {Array.isArray(workspaceInfo.data?.data.workspace.settings.available_tags) && workspaceInfo.data?.data.workspace.settings.available_tags.map((tag:string,index:number) => {
          return <Form.TagPicker.Item key={tag+'-'+index} value={tag} title={tag} />
        }
        )}
        
      </Form.TagPicker>
      <Form.Separator />
  

    </Form>
  );
}
