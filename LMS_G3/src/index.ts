import {
  $update,
  $query,
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
import { v4 as uuidv4 } from "uuid";

// Define the Livestock type for storing livestock information
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

// Define the LivestockPayload type for creating a new livestock entry
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

// Create StableBTreeMap to store livestock entries
const livestockStorage = new StableBTreeMap<string, Livestock>(0, 44, 1024);

$update;
export function createLivestock(payload: LivestockPayload): Result<Livestock, string> {
  // Payload Validation
  if (
    !payload.species ||
    !payload.name ||
    !payload.sex ||
    !payload.coatcolour ||
    !payload.brand ||
    !payload.breed ||
    !payload.dob ||
    !payload.marking ||
    !payload.tagNo
  ) {
    return Result.Err<Livestock, string>("All required fields must be present in the payload.");
  }

  try {
    // Explicit Property Setting
    const livestock: Livestock = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      species: payload.species,
      name: payload.name,
      sex: payload.sex,
      coatcolour: payload.coatcolour,
      brand: payload.brand,
      breed: payload.breed,
      dob: payload.dob,
      marking: payload.marking,
      tagNo: payload.tagNo,
      owner: ic.caller(),
    };

    // Insert the new livestock entry into the storage
    livestockStorage.insert(livestock.id, livestock);
    return Result.Ok<Livestock, string>(livestock);
  } catch (error) {
    // Return an error if the insertion fails
    return Result.Err<Livestock, string>(`Failed to create livestock entry. ${error}`);
  }
}

$query;
export function getLivestockById(id: string): Result<Livestock, string> {
  // Parameter Validation
  if (!id || typeof id !== "string") {
    return Result.Err<Livestock, string>("Invalid ID parameter.");
  }

  // Error Handling
  try {
    // Retrieve the livestock entry from storage
    return match(livestockStorage.get(id), {
      Some: (livestock) => Result.Ok<Livestock, string>(livestock),
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    // Return an error if the retrieval fails
    return Result.Err<Livestock, string>(`Failed to get livestock entry. ${error}`);
  }
}

$query;
export function getLivestockByName(name: string): Result<Livestock, string> {
  // Parameter Validation
  if (!name || typeof name !== "string") {
    return Result.Err<Livestock, string>("Invalid name parameter.");
  }

  // Find livestock entries by name
  const livestockList = livestockStorage.values();
  const foundLivestock = livestockList.find((livestock) => livestock.name.toLowerCase() === name.toLowerCase());

  if (foundLivestock) {
    return Result.Ok<Livestock, string>(foundLivestock);
  }

  return Result.Err<Livestock, string>(`Livestock with name="${name}" not found.`);
}

$query;
export function getAllLivestock(): Result<Vec<Livestock>, string> {
  // Error Handling
  try {
    // Return all livestock entries
    return Result.Ok(livestockStorage.values());
  } catch (error) {
    // Return an error if the operation fails
    return Result.Err<Vec<Livestock>, string>(`Failed to get all livestock entries. ${error}`);
  }
}

$update;
export function updateLivestock(id: string, payload: LivestockPayload): Result<Livestock, string> {
  // Parameter Validation
  if (!id || typeof id !== "string") {
    return Result.Err<Livestock, string>("Invalid ID parameter.");
  }

  // Payload Validation
  if (
    !payload.species ||
    !payload.name ||
    !payload.sex ||
    !payload.coatcolour ||
    !payload.brand ||
    !payload.breed ||
    !payload.dob ||
    !payload.marking ||
    !payload.tagNo
  ) {
    return Result.Err<Livestock, string>("All required fields must be present in the payload.");
  }

  try {
    // Retrieve the existing livestock entry
    return match(livestockStorage.get(id), {
      Some: (existingLivestock) => {
        // Selective Update
        const updatedLivestock: Livestock = {
          ...existingLivestock,
          ...payload,
          updatedAt: Opt.Some(ic.time()),
        };

        // Insert the updated livestock entry into storage
        livestockStorage.insert(updatedLivestock.id, updatedLivestock);
        return Result.Ok<Livestock, string>(updatedLivestock);
      },
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    // Return an error if the update fails
    return Result.Err<Livestock, string>(`Failed to update livestock entry. ${error}`);
  }
}

$update;
export function deleteLivestock(id: string): Result<Livestock, string> {
  // Parameter Validation
  if (!id || typeof id !== "string") {
    return Result.Err<Livestock, string>("Invalid ID parameter.");
  }

  try {
    // Retrieve and remove the livestock entry
    return match(livestockStorage.get(id), {
      Some: (existingLivestock) => {
        livestockStorage.remove(id);
        return Result.Ok<Livestock, string>(existingLivestock);
      },
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    // Return an error if the deletion fails
    return Result.Err<Livestock, string>(`Failed to delete livestock entry. ${error}`);
  }
}

// Cryptographic utility for generating random values
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
