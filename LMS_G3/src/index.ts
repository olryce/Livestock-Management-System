import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { randomUUID } from "crypto"; // Use crypto.randomUUID instead of uuidV4

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
  const livestock: Livestock = {
    id: randomUUID(), // Use crypto.randomUUID instead of uuidV4
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
    owner: ic.caller(),
  };

  livestockStorage.insert(livestock.id, livestock);
  return Result.Ok<Livestock, string>(livestock);
}

$query;
export function getLivestockById(id: string): Result<Livestock, string> {
  return match(livestockStorage.get(id), {
    Some: (livestock) => Result.Ok<Livestock, string>(livestock),
    None: () => Result.Ok<Livestock, string>(None), // Return Result.Ok(None) instead of Result.Err
  });
}

$query;
export function getLivestockByName(name: string): Result<Vec<Livestock>, string> {
  const livestock = livestockStorage.values();

  const foundLivestock = livestock.filter(
    (livestock) => livestock.name.toLowerCase() === name.toLowerCase()
  );

  if (foundLivestock.length > 0) {
    return Result.Ok<Vec<Livestock>, string>(foundLivestock);
  }

  return Result.Err<Vec<Livestock>, string>(`Livestock with name="${name}" not found.`);
}

$query;
export function getAllLivestock(): Result<Vec<Livestock>, string> {
  return Result.Ok(livestockStorage.values());
}

$update;
export function updateLivestock(id: string, payload: LivestockPayload): Result<Livestock, string> {
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
    None: () => Result.Err<Livestock, string>(`Livestock with id=${id} not found.`),
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
