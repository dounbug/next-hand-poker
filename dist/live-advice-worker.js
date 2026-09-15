import {estimateAdvice} from './live-advice.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,result:estimateAdvice(data.input)});}catch{self.postMessage({id:data.id,error:true});}};
