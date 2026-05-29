// Simple fetch helpers with safe fallbacks
export async function fetchLoveMessages(){
  try{
    const res = await fetch('/api/love-messages')
    if(!res.ok) throw new Error('bad')
    const data = await res.json()
    return Array.isArray(data)?data:[]
  }catch{ return [] }
}

export async function fetchCoverTitle(){
  try{
    const res = await fetch('/api/cover-title')
    if(!res.ok) throw new Error('bad')
    const data = await res.json()
    return typeof data?.title==='string'?data.title:''
  }catch{ return '' }
}
