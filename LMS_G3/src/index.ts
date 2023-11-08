import {
    $query, $update, Record,    
    StableBTreeMap,    Vec,    
    match, Result, nat64,
    ic, Opt, Principal,
  } from "azle";
  import { v4 as uuidv4 } from "uuid";
  
  type Livestock = Record<{
    id: string;
    species: string;
    name: string;
    sex: string;
    coatcolour: string; 
    brand: string; 
    breed: string; 
    dob: string; 
    marking: string;
    tagNo: string;
    owner: Principal;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
  }>;
  
  type LivestockPayload = Record<{
    species: string;
    name: string;
    sex: string;
    coatcolour: string; 
    brand: string; 
    breed: string; 
    dob: string; 
    marking: string;
    tagNo: string;

  }>;
  
  const livestockStorage = new StableBTreeMap<string, Livestock>(0, 44, 1024);

  $update;
  export function CreateLivestock(payload: LivestockPayload): Result<Livestock, string> {
    const livestock : Livestock = {
      id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
        owner: ic.caller(),

      
    };
    livestockStorage.insert(livestock.id, livestock)
    return Result.Ok<Livestock, string>(livestock)
  }


  

  
  $query;
  export function getLivestockById(id: string): Result<Livestock, string> {
    return match(livestockStorage.get(id), {
      Some: (livestock) => Result.Ok<Livestock, string>(livestock),
      None: () => Result.Err<Livestock, string>(`livestock with id=${id} not found.`),
    });
  }
  $query;
  export function getLivestockByName(name: string): Result<Livestock, string> {
    const livestock = livestockStorage.values();
  
    const foundLivestock = livestock.find((livestock) => livestock.name.toLowerCase() === name.toLowerCase());
  
    if (foundLivestock) {
      return Result.Ok<Livestock, string>(foundLivestock);
    }
  
    return Result.Err<Livestock, string>(`Livestock with name="${name}" not found.`);
  }
  
  
  $query;
  export function getAllLivestock(): Result<Vec<Livestock>, string> {
    return Result.Ok(livestockStorage.values());
  }
  
  $update;
  export function updatedLivestock(id: string, payload: LivestockPayload): Result<Livestock, string> {
    return match(livestockStorage.get(id), {
      Some: (existingLivestock) => {
        const updatedLivestock: Livestock = {
          ...existingLivestock,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };
  
        livestockStorage.insert(updatedLivestock.id, updatedLivestock);
        return Result.Ok<Livestock, string>(updatedLivestock);
      },
      None: () => Result.Err<Livestock, string>(`Car with id=${id} not found.`),
    });
  }
  
  $update;
  export function deleteLivestock(id: string): Result<Livestock, string> {
    return match(livestockStorage.get(id), {
      Some: (existingLivestock) => {
        livestockStorage.remove(id);
        return Result.Ok<Livestock, string>(existingLivestock);
      },
      None: () => Result.Err<Livestock, string>(`Livestock with id=${id} not found.`),
    });
  }
  globalThis.crypto = {
    //@ts-ignore
    getRandomValues: () => {
      let array = new Uint8Array(32);
  
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
  
      return array;
    },
  };
  
