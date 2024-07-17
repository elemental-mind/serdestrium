import { ICustomSerialization } from "../source/serium.ts";

export class SimpleTestClass
{
    public name = "";
    public age = 35;
    public isActive = false;
    public preferences = {
        mail: "john.doe@example.com",
        marketing: false
    };

    setName(name: string): void
    {
        this.name = name;
    }

    incrementAge(): void
    {
        this.age++;
    }

    toggleActive(): void
    {
        this.isActive = !this.isActive;
    }
}

export class CustomizedTestClass implements ICustomSerialization
{
    public name = "";
    public age = 35;
    #isActive = false;
    public preferences = {
        mail: "john.doe@example.com",
        marketing: false
    };

    subscribe(mail: string)
    {
        this.preferences.mail = mail;
    }

    unsubscribe()
    {
        this.preferences.mail = "";
    }

    consent()
    {
        this.preferences.marketing = true;
    }

    revokeConsent()
    {
        this.preferences.marketing = false;
    }

    onPostSerialization(dataObject: any)
    {
        dataObject.isActive = this.#isActive;
    }

    onPostDeserialization(dataObject: any)
    {
        this.#isActive = dataObject.isActive;
    }
}

export class TestRing<T>
{
    private entry: TestRingElement<T> | null = null;

    add(value: T): void
    {
        const newElement = new TestRingElement<T>(value);
        if (!this.entry)
        {
            newElement.next = newElement;
            newElement.previous = newElement;
        }
        else
        {
            newElement.next = this.entry.next;
            newElement.previous = this.entry;
            this.entry.next!.previous = newElement;
            this.entry.next = newElement;
        }
        this.entry = newElement;
    }

    rotateLeft()
    {
        if (this.entry)
        {
            this.entry = this.entry.next!;
        }
    }

    rotateRight()
    {
        if (this.entry)
        {
            this.entry = this.entry.previous!;
        }
    }
}

export class TestRingElement<T>
{
    constructor(
        public value: T,
        public previous: TestRingElement<T> | null = null,
        public next: TestRingElement<T> | null = null
    ) { }
}